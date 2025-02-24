// 匯入依賴
import https from "https";
import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";
import bodyParser from "body-parser";

// 載入環境變數
dotenv.config();

// 初始化 Express 應用
const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.LINE_ACCESS_TOKEN;

// 中介軟體 (Middleware) 設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 測試路由 - 根目錄
app.get("/", (_req, res) => {
  res.sendStatus(200);
});

// 驗證簽名來源
const validateSignature = (signature, body) => {
  const hash = crypto
    .createHmac("SHA256", process.env.LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
};

// Webhook 路由 - 處理來自 LINE 的訊息
app.post("/webhook", bodyParser.raw({ type: "*/*" }), (req, res) => {
  const signature = req.headers["x-line-signature"];
  const body = req.body.toString("utf-8");

  // 簽名驗證
  if (!validateSignature(signature, body)) {
    console.error("❌ 簽名驗證失敗");
    return res.status(403).send("Invalid signature");
  }

  console.log("✅ 簽名驗證成功");
  res.status(200).send("Webhook received");

  // 處理訊息事件
  const event = JSON.parse(body).events[0];
  if (event && event.type === "message") {
    const replyToken = event.replyToken;
    const userMessage = event.message.text;

    const dataString = JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: "text", text: `你說了：${userMessage}` }],
    });

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
    };

    const webhookOptions = {
      hostname: "api.line.me",
      path: "/v2/bot/message/reply",
      method: "POST",
      headers: headers,
    };

    const request = https.request(webhookOptions, (response) => {
      response.on("data", (d) => process.stdout.write(d));
    });

    request.on("error", (err) => console.error("❌ 發送訊息失敗：", err));

    request.write(dataString);
    request.end();
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log("🚀 LINE Bot 伺服器運行中！");
});
