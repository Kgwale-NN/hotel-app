const { test } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../dist/config/db').default;
const provider = require('../dist/services/paystack.service');
const { handlePaystackWebhook, initializeBookingPayment } = require('../dist/controllers/payments.controller');
const { updateAdminBookingStatus } = require('../dist/controllers/admin.controller');
const bookingId = '20000000-0000-4000-8000-000000000002';
const response = () => ({ statusCode:200, status(c){this.statusCode=c;return this},json(b){this.body=b;return this},sendStatus(c){this.statusCode=c;return this} });
test('payment webhook queues approval exactly once and admin approval requires successful payment',async t=>{
 const oldConnect=pool.connect,oldQuery=pool.query,oldSignature=provider.isValidPaystackSignature;
 let paid=false,queries=[],failNotifications=false;
 pool.connect=async()=>({release(){},async query(sql,values){queries.push({sql,values});if(sql.includes('FROM payments AS p'))return {rows:[{id:'payment',booking_id:bookingId,user_id:'guest',amount:'2200',currency:'ZAR',status:paid?'succeeded':'pending',booking_status:'pending',payment_due_at:new Date(Date.now()+86400000)}]};if(sql.includes('SELECT id, user_id, status FROM bookings'))return {rows:[{id:bookingId,user_id:'guest',status:'pending'}]};if(sql.startsWith('SELECT 1 FROM payments'))return {rows:paid?[{exists:1}]:[]};if(failNotifications&&sql.includes('INSERT INTO notifications'))throw Error('Mock notification failure');return {rows:[{id:bookingId,status:'confirmed'}]};}});
 provider.isValidPaystackSignature=()=>true;
 const req=()=>({rawBody:Buffer.from('{}'),get(){return 'test-signature'},body:{event:'charge.success',data:{reference:'reference',status:'success',amount:220000,currency:'ZAR'}}});
 try {
  await t.test('new success notifies guest and admins without confirming',async()=>{queries=[];const res=response();await handlePaystackWebhook(req(),res);assert.equal(res.statusCode,200);assert.ok(queries.some(q=>q.sql.includes('SET hold_expires_at = NULL')));assert.equal(queries.filter(q=>q.sql.includes('INSERT INTO notifications')).length,2);assert.ok(!queries.some(q=>q.sql.includes("SET status = 'confirmed'")));assert.ok(queries.some(q=>q.sql.includes('COMMIT')));});
  await t.test('repeated webhook does not duplicate notification or booking changes',async()=>{paid=true;queries=[];const res=response();await handlePaystackWebhook(req(),res);assert.equal(res.statusCode,200);assert.ok(!queries.some(q=>q.sql.includes('INSERT INTO notifications')));});
  await t.test('amount mismatch rejects payment',async()=>{paid=false;queries=[];const input=req();input.body.data.amount=1;const res=response();await handlePaystackWebhook(input,res);assert.equal(res.statusCode,400);assert.ok(!queries.some(q=>q.sql.includes('INSERT INTO notifications')));});
  await t.test('notification failure rolls back so provider can retry safely',async()=>{queries=[];failNotifications=true;const res=response();await handlePaystackWebhook(req(),res);assert.equal(res.statusCode,500);assert.ok(queries.some(q=>q.sql.includes('ROLLBACK')));assert.ok(!queries.some(q=>q.sql.includes('COMMIT')));failNotifications=false;});
  await t.test('admin cannot approve an unpaid booking',async()=>{queries=[];paid=false;const res=response();await updateAdminBookingStatus({params:{bookingId},body:{status:'confirmed'}},res);assert.equal(res.statusCode,409);assert.ok(!queries.some(q=>q.sql.includes("SET status = 'confirmed'")));});
  await t.test('admin confirms paid booking and notifies guest',async()=>{queries=[];paid=true;const res=response();await updateAdminBookingStatus({params:{bookingId},body:{status:'confirmed'}},res);assert.equal(res.statusCode,200);assert.ok(queries.some(q=>q.sql.includes("SET status = 'confirmed'")));assert.equal(queries.filter(q=>q.sql.includes('INSERT INTO notifications')).length,1);});
  await t.test('already paid pending reservation cannot start another checkout',async()=>{pool.query=async sql=>({rows:sql.includes('FROM bookings AS b')?[{id:bookingId,status:'pending',payment_due_at:new Date(Date.now()+86400000)}]:[{exists:1}]});const res=response();await initializeBookingPayment({params:{id:bookingId},session:{userId:'guest'}},res);assert.equal(res.statusCode,409);assert.match(res.body.message,/already received/);});
 }finally{pool.connect=oldConnect;pool.query=oldQuery;provider.isValidPaystackSignature=oldSignature;}
});
