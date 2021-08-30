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

const createUser = async (ctx) => {
  const { request } = ctx
  const { openid } = request.body
  const userObj = {
    email: `${openid}@codesmiths.co`,
    username: openid,
    open_id: openid
  }
  const newUser = await strapi.query('user', 'users-permissions').create(userObj)
  const sanitizedUser = sanitizeEntity(newUser, {
    model: strapi.query('user', 'users-permissions').model,
  });
  const jwt = getJWT(newUser)
  return ctx.send({
    jwt,
    user: sanitizedUser,
  });
}

const returnUserWithJWT = async (ctx, user) => {
    const jwt = getJWT(user)
    return ctx.send({
      jwt,
      user: user,
    });
}

const getUserById = async(ctx, id) => {
  const user = await strapi.query('user','users-permissions').findOne({
    id: id
  });
  const jwt = getJWT(user)
  return ctx.send({
    jwt: jwt,
    user: user,
  });
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
      return createUser(ctx)
    } else {
      return returnUserWithJWT(ctx, user)
    }
  } else {
    return getUserById(ctx, id)
  }
}

const update = async(ctx, next) => {
  const { request, response } = ctx
  console.log(request.body)
  console.log(request.header.authorization)

  const { session_key, openid } = await wx.wxLoginApi(jsCode)
  const { id } = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx)

  console.log(wx.decryptData)
}
  
module.exports = {
  wxLogin, update

};