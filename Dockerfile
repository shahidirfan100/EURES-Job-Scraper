FROM apify/actor-node:22

COPY --chown=myuser:myuser package*.json ./

RUN npm --quiet set progress=false \
	&& npm install --omit=dev \
	&& node -e "import('impit').then(() => console.log('impit OK'))" \
	&& rm -r ~/.npm

COPY --chown=myuser:myuser . ./

CMD npm start --silent
