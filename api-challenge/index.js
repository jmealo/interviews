const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const deidentify = require('./deidentify');

const PORT = process.env.PORT || 3000;

const app = new Koa();
app.use(bodyParser({enableTypes: ['json']}));

app.use(async ctx => {
    ctx.body = deidentify(ctx.request.body);
});

app.listen(PORT);
console.log(`Listening on: ${PORT}`);
