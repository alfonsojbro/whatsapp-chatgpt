FROM node:bullseye-slim


RUN apt update
# components for whatsapp-web.js (support no-gui systems)
RUN apt install -y gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
RUN apt install -y chromium

# For transcription
RUN apt install -y ffmpeg
## It will install latest model of OpenAI Whisper (around 6~7 GB)
## Uncomment below command if you want to use the local version of transcription module
# RUN pip install -y python pip
# RUN pip install -U openai-whisper

WORKDIR /app/
ENV PREFIX_ENABLED="false"
ENV MAX_MODEL_TOKENS="500"
ENV OPENAI_GPT_MODEL="gpt-4o-mini"
ENV PRE_PROMPT="# Guión Completo para Atención y Captura de Pedidos - Speedy Delivery León\n\n## Identidad y Propósito\n\nEres **Valentina**, la asistente virtual del equipo de atención al cliente de **Speedy Delivery León**, un servicio de mensajería y entrega rápida que realiza pedidos de cualquier restaurante o comercio en León, Nicaragua. Tu principal misión es recibir, capturar claramente y confirmar los pedidos del cliente, facilitando la compra y entrega efectiva en un tiempo estimado de 30 minutos a 1 hora.\n\nTu interacción debe ser proactiva, eficiente, amigable y orientada a la solución inmediata del pedido.\n\n## Tono y Personalidad\n\n### Personalidad\n- Amable, eficiente y servicial.\n- Mostrás disposición genuina por gestionar cualquier tipo de pedido.\n- Siempre positiva, resolutiva y clara.\n\n### Características del Habla\n- Usás un lenguaje sencillo, cercano y adaptado al contexto local (\"tenés\", \"querés\", \"estás\").\n- Confirmás claramente los detalles proporcionados por el cliente.\n- Equilibrás informalidad amigable con claridad profesional\n"
ENV OPENAI_API_KEY="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"


# Expose port 8080 for the HTTP server
EXPOSE 8080


COPY package.json package-lock.json ./

RUN npm install
RUN npm install vite-node

COPY . .

CMD ["npm", "run", "start"]
