"use client";

import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Package, MapPin, Phone, Calendar, Hash, Truck } from "lucide-react";

const PackingSlip = ({ order, variant = "a4" }) => {
  if (!order) return null;

  const isThermal = variant === "thermal";

  const totalQuantity = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className={`packing-slip-container ${isThermal ? "w-[80mm]" : "w-[210mm]"} bg-white text-black p-4 inline-block font-sans print:p-0`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body > *:not(.packing-slip-container) {
            display: none !important;
          }
          .packing-slip-container {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0;
            size: ${isThermal ? "80mm auto" : "A4"};
          }
        }
      `}} />

      <div className="packing-slip-print-area border border-slate-200">
        {/* HEADER */}
        <div className={`flex ${isThermal ? "flex-col items-center text-center" : "justify-between items-start"} border-b-2 border-black pb-4 mb-4`}>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-indigo-600">{process.env.NEXT_PUBLIC_SHOP_NAME || "FOREIGN EMPORIUM"}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Official Invoice & Packing Slip</p>
          </div>
          <div className={`${isThermal ? "mt-4 text-center" : "text-right"}`}>
            <h2 className="text-xl font-bold uppercase">Packing Slip</h2>
            <div className="flex items-center gap-2 text-sm font-mono mt-1 justify-center sm:justify-end">
              <Hash className="w-3 h-3" /> {order.order_number}
            </div>
          </div>
        </div>

        {/* INFO GRID */}
        <div className={`grid ${isThermal ? "grid-cols-1 gap-4" : "grid-cols-2 gap-8"} mb-6 text-sm`}>
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Ship To
            </h3>
            <div className="font-bold text-base">{order.delivery_address?.full_name || order.user?.name}</div>
            <div className="text-slate-600 mt-1 leading-tight">
              {order.delivery_address?.address_line_1}<br />
              {order.delivery_address?.address_line_2 && <>{order.delivery_address.address_line_2}<br /></>}
              {order.delivery_address?.city}, {order.delivery_address?.state} {order.delivery_address?.postal_code}<br />
              {order.delivery_address?.country}
            </div>
            <div className="flex items-center gap-1 mt-2 font-mono text-xs">
              <Phone className="w-3 h-3" /> {order.delivery_address?.phone || order.customer?.phone}
            </div>
          </div>

          <div className={`${isThermal ? "border-t border-dashed pt-4" : ""}`}>
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1">
              <Package className="w-3 h-3" /> Order Details
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ship Method:</span>
                <span className="font-bold">{order.courier_name || "Standard Shipping"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items:</span>
                <span className="font-bold">{totalQuantity} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold uppercase text-[10px] border border-black px-1 rounded">{order.payment_status || order.latest_payment?.payment_status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-6">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-y-2 border-black bg-slate-50">
                <th className="py-2 px-1 font-black uppercase text-[10px]">Description</th>
                <th className="py-2 px-1 font-black uppercase text-[10px] text-center">SKU</th>
                <th className="py-2 px-1 font-black uppercase text-[10px] text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items?.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="py-3 px-1">
                    <div className="font-bold">{item.product_name}</div>
                    <div className="text-[10px] text-slate-500 italic">{item.variant_name}</div>
                  </td>
                  <td className="py-3 px-1 text-center font-mono text-xs text-slate-600">{item.sku}</td>
                  <td className="py-3 px-1 text-right font-bold">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER / QR */}
        <div className={`flex ${isThermal ? "flex-col" : "justify-between"} items-center border-t-2 border-black pt-4 mt-auto`}>
          <div className={`${isThermal ? "order-2 mt-4 text-center" : "max-w-[60%]"}`}>
            <p className="text-[10px] text-slate-500 leading-tight italic">
              Thank you for choosing {process.env.NEXT_PUBLIC_SHOP_NAME || "FOREIGN EMPORIUM"}. Please inspect your items immediately upon receipt. 
              Returns must be initiated within 7 days in original packaging.
            </p>
          </div>
          <div className={`${isThermal ? "order-1" : ""} flex flex-col items-center`}>
            <QRCodeCanvas 
              value={`${order.order_number}`} 
              size={isThermal ? 80 : 60}
              level="M"
              includeMargin={false}
            />
            <span className="text-[8px] font-mono mt-1 opacity-50">{order.order_number}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackingSlip;
