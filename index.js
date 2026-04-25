const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/webhook/order", async (req, res) => {
    const order = req.body;
    const rawPincode = order.shipping_address?.zip || "";
    const cleanPincode = rawPincode.toString().replace(/\D/g, "");
    const finalPincode = cleanPincode.length === 6 ? cleanPincode : "110001";

    const rawPhone = order.shipping_address?.phone || "";
    const cleanPhone = rawPhone.toString().replace(/\D/g, "");
    const finalPhone = cleanPhone.length >= 10 
    ? cleanPhone.slice(-10) 
    : "9999999999";
    try {
        const tokenRes = await axios.post(
            "https://api.shipdaak.com/v1/auth/token",
            {
                email: "Care@thevelvetveils.com",
                password: "Tanuja@141980"
            }
        );

        const token = tokenRes.data.access_token;


        const shipmentRes = await axios.post(
            "https://api.shipdaak.com/v1/shipments/generate-shipment",
            {
                order_no: order.name || order.id.toString(),
                pay_type: order.financial_status === "pending" ? "cod" : "prepaid",
                weight: 500,

                total_amount: order.total_price,

                courier: 8, // change if needed
                pickup_warehouse: 1,
                rto_warehouse: 1,

                consignee: {
                    name: order.shipping_address?.name || "Customer",
                    address1: order.shipping_address?.address1,
                    city: order.shipping_address?.city,
                    state: order.shipping_address?.province,
                    pincode: finalPincode,
                    phone: finalPhone
                },

                order_items: order.line_items.map(item => ({
                    name: item.title,
                    quantity: item.quantity,
                    price: item.price,
                    sku: item.sku || "SKU"
                }))
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json"
                }
            }
        );

        console.log("✅ Shipment Created:", shipmentRes.data);

        res.sendStatus(200);

    } catch (err) {
        console.error("❌ Error:", err.response?.data || err.message);
        res.sendStatus(500);
    }
});

app.listen(3000, () => console.log("🚀 Server running"));