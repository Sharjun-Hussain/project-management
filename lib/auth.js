import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const FIREBASE_TOKEN_EXPIRES_IN = 86400; // 86400 seconds = 24 hours

export const authOptions = {
    session: {
        strategy: "jwt",
        maxAge: FIREBASE_TOKEN_EXPIRES_IN,
    },

    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials) {
                // Determine if API key is provided, if not warn.
                if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
                    console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY in environment variables.");
                    // Fallback stub for dev without keys yet, delete before prod
                    return {
                        id: "firebase-stub-id",
                        name: "Firebase Admin",
                        email: credentials.email,
                        accessToken: "stub-token",
                        roles: [{ name: "Super Admin", permissions: [] }]
                    };
                }

                try {
                    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                            returnSecureToken: true
                        }),
                    });

                    const responseData = await res.json();

                    if (!res.ok) {
                        console.error("Firebase Login Failed:", responseData.error?.message);
                        return null; // Return null to trigger failure
                    }

                    // Successful login
                    return {
                        id: responseData.localId,
                        name: responseData.displayName || "Admin",
                        email: responseData.email,
                        profileImage: responseData.profilePicture || "",
                        accessToken: responseData.idToken,
                        // Grant all permissions for personal use
                        roles: [{ name: "Super Admin", permissions: [] }],
                    };
                } catch (e) {
                    console.error("Firebase request failed:", e);
                    return null;
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.accessToken;
                token.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.profileImage,
                    usertype: "admin", // Admin default
                    canlogin: 1,
                    roles: user.roles || [],
                };
            }
            return token;
        },

        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.user = token.user;
            return session;
        },
    },

    pages: {
        signIn: "/login",
    },
};
