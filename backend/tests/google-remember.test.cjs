const {test}=require('node:test');const assert=require('node:assert/strict');
const {googleClient}=require('../dist/config/google');const service=require('../dist/services/auth.service');const {startGoogleLogin,googleCallback}=require('../dist/controllers/auth.controller');
test('Google remember-me survives OAuth and session renewal without trusting client roles',async()=>{
 const oldToken=googleClient.getToken,oldVerify=googleClient.verifyIdToken,oldFind=service.findOrCreateGoogleUser;
 googleClient.getToken=async()=>({tokens:{id_token:'mock'}});service.findOrCreateGoogleUser=async()=> 'guest-id';
 try{for(const remember of [true,false]){
 const req={query:{remember_me:String(remember)},session:{save(done){done()}}};const res={redirect(url){this.url=url},status(c){this.statusCode=c;return this},json(b){this.body=b;return this}};
 await startGoogleLogin(req,res);const attempt=req.session.googleAuth;assert.equal(attempt.rememberMe,remember);
 googleClient.verifyIdToken=async()=>({getPayload:()=>({sub:'google-id',email:'guest@example.test',email_verified:true,nonce:attempt.nonce})});
 req.query={code:'mock-code',state:attempt.state};req.session.regenerate=done=>{req.session={cookie:{expires:new Date()},save(cb){cb()}};done()};await googleCallback(req,res);
 assert.equal(req.session.userId,'guest-id');assert.ok(res.url.includes('/auth/return'));if(remember)assert.equal(req.session.cookie.maxAge,30*86400000);else assert.equal(req.session.cookie.expires,undefined);
 }}finally{googleClient.getToken=oldToken;googleClient.verifyIdToken=oldVerify;service.findOrCreateGoogleUser=oldFind;}
});
