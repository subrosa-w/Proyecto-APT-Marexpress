import app from "./src/app.js";

const puerto = Number(process.env.PORT) || 3000;

app.listen(puerto, () => {
    console.log(`MAREXPRESS API en http://localhost:${puerto}`);
});
