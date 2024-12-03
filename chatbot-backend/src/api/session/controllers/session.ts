import { factories } from '@strapi/strapi';

// src/api/session/controllers/session.ts

export default factories.createCoreController('api::session.session', ({ strapi }) => ({
  // In src/api/session/controllers/session.ts
async getUserSessions(ctx) {
  const { user } = ctx.state;
  try {
    const sessions = await strapi.db.query('api::session.session').findMany({
      where: {
        user: {
          id: user.id
        }
      },
      orderBy: { sessionCreatedAt: 'desc' },
      populate: {
        user: true
      }
    });

    return ctx.send({
      data: sessions.map(session => ({
        id: session.id.toString(),
        attributes: {
          name: session.name,
          messages: session.messages || [], // Ensure messages are included
          sessionCreatedAt: session.sessionCreatedAt,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }
      }))
    });
  } catch (error) {
    return ctx.badRequest('Error fetching sessions');
  }
},

  async saveSession(ctx) {
    const { user } = ctx.state;
    const { name, messages } = ctx.request.body;
    
    try {
      const session = await strapi.db.query('api::session.session').create({
        data: {
          name,
          messages,
          sessionCreatedAt: new Date(),
          user: user.id
        },
        populate: {
          user: true
        }
      });
      return ctx.send(session);
    } catch (error) {
      return ctx.badRequest('Error creating session');
    }
  },
  async updateSession(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;  // Change to get data from request body
    const { user } = ctx.state;

    console.log('Update request body:', ctx.request.body);
    console.log('Data to update:', data);

    try {
      const existingSession = await strapi.db.query('api::session.session').findOne({
        where: { id },
        populate: {
          user: true
        }
      });

      if (!existingSession || existingSession.user.id !== user.id) {
        return ctx.notFound('Session not found');
      }

      const session = await strapi.db.query('api::session.session').update({
        where: { id },
        data: {
          name: data.name,
          messages: data.messages,
          sessionCreatedAt: data.sessionCreatedAt
        },
        populate: {
          user: true
        }
      });

      console.log('Updated session:', session);
      return ctx.send(session);
    } catch (error) {
      console.error('Update error:', error);
      return ctx.badRequest('Error updating session');
    }
},

async deleteSession(ctx) {
  const { id } = ctx.params;
  const { user } = ctx.state;

  try {
    const session = await strapi.db.query('api::session.session').findOne({
      where: { id },
      populate: { user: true }
    });

    if (!session || session.user.id !== user.id) {
      return ctx.notFound('Session not found');
    }

    await strapi.db.query('api::session.session').delete({
      where: { id }
    });

    return ctx.send({ message: 'Session deleted' });
  } catch (error) {
    return ctx.badRequest('Error deleting session');
  }
}

}));