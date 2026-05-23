import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const LARAVEL_TOKEN_EXPIRES_IN = 86400; // 86400 seconds = 24 hours

export const authOptions = {
    session: {
        strategy: "jwt",
        maxAge: LARAVEL_TOKEN_EXPIRES_IN,
    },

    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials) {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                    },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                    }),
                });

                const responseData = await res.json();

                if (responseData.status !== "success" || !res.ok) {
                    console.error("Failed to login:", responseData.message);
                    return null;
                }

                const user = responseData.data.user;
                const token = responseData.data.auth_token;

                return {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    usertype: user.user_type,
                    canlogin: user.can_login,
                    email: user.email,
                    profileImage: user.profile_image,
                    accessToken: token,
                    roles: user.roles || [],
                };
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
                    usertype: user.usertype,
                    canlogin: user.canlogin,
                    roles: user.roles || [],
                };

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
                        headers: {
                            Authorization: `Bearer ${user.accessToken}`,
                            Accept: "application/json",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                        },
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.status === "success" && data.data?.user) {
                            const userData = data.data.user;
                            token.user = {
                                ...token.user,
                                roles: userData.roles || [],
                            };
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user permissions:", error);
                }
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
