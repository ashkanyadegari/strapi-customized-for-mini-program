let crypto = require('crypto')
const axios = require('axios')

class WX {
	constructor() {
		this.appId = process.env.WX_APPID
		this.secret = process.env.WX_SECRET
		// this.sessionKey = sessionKey
	}

	decryptData(sessionKey, encryptedData, iv) {
		// base64 decode
		sessionKey = Buffer.from(sessionKey, 'base64')
		encryptedData = Buffer.from(encryptedData, 'base64')
		iv = Buffer.from(iv, 'base64')

		try {
			let decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
			decipher.setAutoPadding(true)
			let decoded = decipher.update(encryptedData, 'binary', 'utf8')
			decoded += decipher.final('utf8')

			decoded = JSON.parse(decoded)

		} catch (err) {
			throw new Error('Illegal Buffer')
		}

		if (decoded.watermark.appid !== this.appId) {
			throw new Error('Illegal Buffer')
		}

		return decoded
	}
	
	generateSignature(sessionKey, rawData) {
		const shasum = crypto.createHash('sha1')
		shasum.update(rawData + sessionKey)
		return shasum.digest('hex')
	}
	
	async getAccessToken() {
		const token_params = {
			appId: this.appId,
			secret: this.secret,
			grant_type: 'client_credential'
		}
		const url = 'https://api.weixin.qq.com/cgi-bin/token'
		const result = await axios.get(url, { params: token_params })
		return result.data
	}

	async wxLoginApi(jsCode) {
		const params = {
			// appid: process.env.WX_APPID,
			// secret: process.env.WX_SECRET,
			appid: this.appId,
			secret: this.secret,
			js_code: jsCode,
			grant_type: 'authorization_code'
		}
		console.log(params)
		const url = 'https://api.weixin.qq.com/sns/jscode2session'
		const result = await axios.get(url, { params: params })
		return result.data
	}
}



module.exports = WX