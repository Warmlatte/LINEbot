// 匯入依賴
import https from "https";
import express from "express";
import dotenv from "dotenv";

// 載入環境變數
dotenv.config();

// 初始化 Express 應用
const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// 使用 express.json() 解析 JSON 請求
app.use(express.json());

// 記錄已回覆過的使用者 ID
const repliedUsers = new Set();

// 測試路由 - 根目錄
app.get("/", (_req, res) => {
  res.sendStatus(200);
});

// Webhook 路由 - 處理來自 LINE 的訊息
app.post("/webhook", (req, res) => {
  // 回應 200 確認收到 Webhook
  res.send("HTTP POST request sent to the webhook URL!");

  // 確認 req.body.events 是否存在且是陣列
  if (Array.isArray(req.body.events) && req.body.events.length > 0) {
    const event = req.body.events[0];

    // 處理所有訊息類型（文字、貼圖等）
    if (event.type === "message") {
      const userId = event.source.userId; // 獲取使用者 ID

      // 檢查是否已經回覆過此使用者
      if (!repliedUsers.has(userId)) {
        // 第一次互動，發送罐頭訊息
        const messages = [
          {
            type: "sticker",
            packageId: "789", // 可以替換成你想要的貼圖
            stickerId: "10855",
          },
          { type: "text", text: "Hello ٩(๑•̀ω•́๑)۶" },
          { type: "text", text: "有什麼需要幫助的嗎？" },
        ];

        // 發送回覆
        const dataString = JSON.stringify({
          replyToken: event.replyToken,
          messages: messages,
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

        // 發送回覆請求到 LINE API
        const request = https.request(webhookOptions, (response) => {
          response.on("data", (d) => process.stdout.write(d));
        });

        request.on("error", (err) => {
          console.error("❌ 發送訊息失敗：", err);
        });

        request.write(dataString);
        request.end();

        // 記錄已回覆的使用者 ID
        repliedUsers.add(userId);
      }
    }
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log("🚀 LINE Bot 伺服器運行中！");
});
