FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && pip3 install --break-system-packages --no-cache-dir pypdfium2==4.30.0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY coach-server ./coach-server
COPY shared/block-contract-v4.generated.json ./shared/block-contract-v4.generated.json
COPY scripts/render-pdf-pages-v4.py ./scripts/render-pdf-pages-v4.py

ENV NODE_ENV=production
ENV PYTHON=python3
EXPOSE 8787
CMD ["node", "coach-server/teacher-server.mjs"]
