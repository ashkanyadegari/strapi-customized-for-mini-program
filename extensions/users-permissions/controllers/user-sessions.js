const crypto = require('crypto');
const _ = require('lodash');
const grant = require('grant-koa');
const { sanitizeEntity } = require('strapi-utils');
const WX = require('../../../utils/wx')
const wx = new WX

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

const getJWT = (user) => {
  const jwt = strapi.plugins['users-permissions'].services.jwt.issue(_.pick(user, ['id']));
  return jwt
}

const createUser = async (ctx, session_key) => {
  const { request } = ctx
  const { openid } = request.body
  const userObj = {
    email: `${openid}@codesmiths.co`,
    username: openid,
    open_id: openid
  }
  const user = await strapi.query('user', 'users-permissions').create(userObj)
  const sanitizedUser = sanitizeEntity(user, {
    model: strapi.query('user', 'users-permissions').model,
  });
  const jwt = getJWT(user)
  return ctx.send({ jwt, user: sanitizedUser, session_key });
}

const returnUserWithJWT = async (ctx, user, session_key) => {
    const jwt = getJWT(user)
    return ctx.send({ jwt, user, session_key });
}

const getUserById = async(ctx, id, session_key) => {
  const user = await strapi.query('user','users-permissions').findOne({
    id: id
  });
  const sanitizedUser = sanitizeEntity(user, {
    model: strapi.query('user', 'users-permissions').model,
  });
  const jwt = getJWT(user)
  return ctx.send({ jwt, user: sanitizedUser, session_key });
}

const wxLogin = async(ctx, next) => {
  const { request, response } = ctx
  const { jsCode } = request.body
  console.log(request.header.authorization)

  const { session_key, openid } = await wx.wxLoginApi(jsCode)
  const { id } = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx)
  const user = await strapi.query('user','users-permissions').findOne({
    open_id: openid
  });

  if (!id) {
    if (!user) {
      return createUser(ctx, session_key)
    } else {
      return returnUserWithJWT(ctx, user, session_key)
    }
  } else {
    return getUserById(ctx, id, session_key)
  }
}

const update = async(ctx, next) => {
  const { request, response } = ctx
  const { userInfo } = request.body

  const { id } = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx)
  const user = await strapi.query('user', 'users-permissions').update({ id: id }, userInfo)
  
  const sanitizedUser = sanitizeEntity(user, {
    model: strapi.query('user', 'users-permissions').model,
  });
  return ctx.send({user: sanitizedUser})

}
  
module.exports = {
  wxLogin, update

};