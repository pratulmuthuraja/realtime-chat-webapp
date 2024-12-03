/**
 * session router
 */

import { factories } from '@strapi/strapi';

// src/api/session/routes/session.ts

export default {
  routes: [
    {
      method: 'GET',
      path: '/sessions',
      handler: 'session.getUserSessions',
      config: {
        auth: {
          required: true
        }
      }
    },
    {
      method: 'POST', 
      path: '/sessions',
      handler: 'session.saveSession',
      config: {
        auth: {
          required: true
        }
      }
    },
    {
      method: 'PUT',
      path: '/sessions/:id', 
      handler: 'session.updateSession',
      config: {
        auth: {
          required: true
        }
      }
    }
  ]
 };