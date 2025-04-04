import qrcode from "qrcode";
import { Client, Message, Events, LocalAuth } from "whatsapp-web.js";

// Constants
import constants from "./constants";

// CLI
import * as cli from "./cli/ui";
import { handleIncomingMessage } from "./handlers/message";

// Config
import { initAiConfig } from "./handlers/ai-config";
import { initOpenAI } from "./providers/openai";

// Ready timestamp of the bot
let botReadyTimestamp: Date | null = null;
let latestRawQr: string | null = null;

const http = require("http");

const PORT = process.env.PORT || 8080;

// HTTP server to show QR in browser
const server = http.createServer(async (req, res) => {
	if (req.url === "/qr") {
		if (!latestRawQr) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			return res.end("QR code not available yet.");
		}

		try {
			const dataUrl = await qrcode.toDataURL(latestRawQr);

			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
				<html>
					<head><title>WhatsApp QR</title></head>
					<body style="text-align:center; font-family:sans-serif; padding:2rem;">
						<h2>Scan this QR Code to connect</h2>
						<img src="${dataUrl}" alt="QR Code" />
					</body>
				</html>
			`);
		} catch (err) {
			res.writeHead(500, { "Content-Type": "text/plain" });
			res.end("Error generating QR");
		}
	} else {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.end("Server is running. Go to /qr to see the code.");
	}
});

server.listen(PORT, () => {
	console.log("🌐 QR code web server running at http://localhost:3000/qr");
});
// Entrypoint
const start = async () => {
	const wwebVersion = "2.2412.54";
	cli.printIntro();

	// WhatsApp Client
	const client = new Client({
		puppeteer: {
			executablePath: "/usr/bin/chromium", // change this if necessary

			args: ["--no-sandbox"]
		},
		authStrategy: new LocalAuth({
			dataPath: constants.sessionPath
		}),
		webVersionCache: {
			type: "remote",
			remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`
		}
	});

	// WhatsApp auth
	client.on(Events.QR_RECEIVED, (qr: string) => {
		latestRawQr = qr; // Save the data URL for later use in the UI

		console.log("");
		qrcode.toString(
			qr,
			{
				type: "terminal",
				small: true,
				margin: 2,
				scale: 1
			},
			(err, url) => {
				if (err) throw err;

				cli.printQRCode(url);
			}
		);
	});

	// WhatsApp loading
	client.on(Events.LOADING_SCREEN, (percent) => {
		if (percent == "0") {
			cli.printLoading();
		}
	});

	// WhatsApp authenticated
	client.on(Events.AUTHENTICATED, () => {
		cli.printAuthenticated();
	});

	// WhatsApp authentication failure
	client.on(Events.AUTHENTICATION_FAILURE, () => {
		cli.printAuthenticationFailure();
	});

	// WhatsApp ready
	client.on(Events.READY, () => {
		// Print outro
		cli.printOutro();

		// Set bot ready timestamp
		botReadyTimestamp = new Date();

		initAiConfig();
		initOpenAI();
	});

	// WhatsApp message
	client.on(Events.MESSAGE_RECEIVED, async (message: any) => {
		// Ignore if message is from status broadcast
		if (message.from == constants.statusBroadcast) return;

		// Ignore if it's a quoted message, (e.g. Bot reply)
		if (message.hasQuotedMsg) return;

		await handleIncomingMessage(message);
	});

	// Reply to own message
	client.on(Events.MESSAGE_CREATE, async (message: Message) => {
		// Ignore if message is from status broadcast
		if (message.from == constants.statusBroadcast) return;

		// Ignore if it's a quoted message, (e.g. Bot reply)
		if (message.hasQuotedMsg) return;

		// Ignore if it's not from me
		if (!message.fromMe) return;

		await handleIncomingMessage(message);
	});

	// WhatsApp initialization
	client.initialize();
};

start();

export { botReadyTimestamp };
