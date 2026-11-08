const { test } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../dist/config/db').default;
const provider = require('../dist/services/paystack.service');
const { verifyBookingPayment } = require('../dist/controllers/payments.controller');
const { getMyBookingById } = require('../dist/controllers/bookings.controller');
const bookingId = '20000000-0000-4000-8000-000000000002';
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } });

test('booking receipt exposes only verified, owned booking information', async t => {
  const originalConnect = pool.connect, originalQuery = pool.query, originalVerify = provider.verifyPaystackTransaction;
  let payment, verified, queries;
  function reset() {
    payment = { id:'payment-test', booking_id:bookingId, user_id:'owner-test', amount:'4550.00', currency:'ZAR', payment_status:'succeeded', booking_status:'confirmed', payment_due_at:new Date(Date.now()+86400000) };
    verified = { reference:'receipt-test', status:'success', amount:455000, currency:'ZAR' };
    queries = [];
  }
  provider.verifyPaystackTransaction = async () => verified;
  pool.connect = async () => ({ release() {}, async query(sql, values) {
    queries.push({sql,values});
    if (sql.includes('FROM payments AS p')) return {rows:payment ? [payment] : []};
    return {rows:[]};
  }});
  const req = () => ({body:{reference:'receipt-test'},session:{userId:'owner-test'}});
  try {
    await t.test('confirmed response identifies the exact booking and paid total', async () => {
      reset(); const res=response();await verifyBookingPayment(req(),res);
      assert.equal(res.statusCode,200);
      assert.deepEqual(res.body.data,{payment_status:'succeeded',booking_id:bookingId,amount:'4550.00',currency:'ZAR',booking_status:'confirmed'});
      const select=queries.find(q=>q.sql.includes('FROM payments AS p'));
      assert.match(select.sql,/b\.user_id = \$2/);assert.equal(select.values[1],'owner-test');
      assert.ok(!queries.some(q=>q.sql.includes('INSERT INTO notifications')));
    });
    await t.test('successful payment stays pending and notifies guest and administrators', async () => {
      reset();payment.payment_status='pending';payment.booking_status='pending';const res=response();await verifyBookingPayment(req(),res);
      assert.equal(res.body.data.booking_status,'pending');assert.equal(res.body.data.booking_id,bookingId);
      assert.ok(!queries.some(q=>q.sql.includes("SET status = 'confirmed'")));
      assert.equal(queries.filter(q=>q.sql.includes("INSERT INTO notifications")).length,2);
      assert.ok(queries.some(q=>q.sql.includes("WHERE role = 'admin'")));
    });
    await t.test('late payment is received but does not falsely confirm the stay', async () => {
      reset();payment.payment_status='pending';payment.booking_status='pending';payment.payment_due_at=new Date(0);const res=response();await verifyBookingPayment(req(),res);
      assert.equal(res.body.data.payment_status,'succeeded');assert.equal(res.body.data.booking_status,'expired');
    });
    await t.test('reverification after the deadline does not expire a paid reservation or duplicate notifications', async () => {
      reset();payment.booking_status='pending';payment.payment_due_at=new Date(0);const res=response();await verifyBookingPayment(req(),res);
      assert.equal(res.body.data.booking_status,'pending');assert.ok(!queries.some(q=>q.sql.includes('INSERT INTO notifications')));assert.ok(!queries.some(q=>q.sql.includes("SET status = 'expired'")));
    });
    await t.test('failed payment never returns success', async () => {
      reset();verified.status='failed';payment.booking_status='pending';payment.payment_status='pending';const res=response();await verifyBookingPayment(req(),res);
      assert.equal(res.body.data.payment_status,'failed');assert.equal(res.body.data.booking_status,'pending');assert.equal(res.body.data.amount,undefined);
    });
    await t.test('mismatched amount and missing owned payment return no receipt', async () => {
      reset();verified.amount=1;const mismatch=response();await verifyBookingPayment(req(),mismatch);assert.equal(mismatch.statusCode,400);assert.equal(mismatch.body.data,undefined);
      reset();payment=undefined;const missing=response();await verifyBookingPayment(req(),missing);assert.equal(missing.statusCode,404);assert.equal(missing.body.data,undefined);
    });
    await t.test('booking details include hotel times and retain ownership filter', async () => {
      let query;
      pool.query=async(sql,values)=>{query={sql,values};return {rows:[{id:bookingId,hotel_check_in_time:'15:00:00',hotel_check_out_time:'12:00:00'}]}};
      const res=response();await getMyBookingById({params:{id:bookingId},session:{userId:'owner-test'}},res);
      assert.equal(res.body.data.hotel_check_in_time,'15:00:00');assert.match(query.sql,/h\.check_in_time AS hotel_check_in_time/);assert.match(query.sql,/b\.user_id = \$2/);assert.deepEqual(query.values,[bookingId,'owner-test']);
    });
  } finally {pool.connect=originalConnect;pool.query=originalQuery;provider.verifyPaystackTransaction=originalVerify}
});
