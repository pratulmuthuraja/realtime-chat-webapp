import websocketPlugin from './plugins/websocket';

export default {
  register({ strapi }) {
    websocketPlugin.register({ strapi });
  },

  bootstrap() {},
  destroy() {},
};
