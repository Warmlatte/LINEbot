// 匯入依賴
import https from "https";
import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";

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
app.post("/webhook", (req, res) => {
  res.send("✅ HTTP POST request sent to the webhook URL!");

  // 驗證簽名
  if (!validateSignature(signature, body)) {
    return res.status(403).send("Invalid signature");
  }

  // 檢查是否為訊息事件
  if (req.body.events && req.body.events[0].type === "message") {
    const replyToken = req.body.events[0].replyToken;
    const userMessage = req.body.events[0].message.text;

    // 回覆訊息內容
    const dataString = JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: "text",
          text: `你說了：${userMessage}`,
        },
        {
          type: "text",
          text: "有什麼我可以幫忙的嗎？😊",
        },
      ],
    });

    // 設定請求標頭
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    };

    // 設定發送到 LINE API 的請求參數
    const webhookOptions = {
      hostname: "api.line.me",
      path: "/v2/bot/message/reply",
      method: "POST",
      headers: headers,
    };

    // 發送 HTTP 請求到 LINE API
    const request = https.request(webhookOptions, (response) => {
      response.on("data", (d) => {
        process.stdout.write(d);
      });
    });

    // 錯誤處理
    request.on("error", (err) => {
      console.error("❌ 發送回覆失敗：", err);
    });

    // 發送請求
    request.write(dataString);
    request.end();
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 LINE Bot 伺服器運行中！http://localhost:${PORT}`);
});
