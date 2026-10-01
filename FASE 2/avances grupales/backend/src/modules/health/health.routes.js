import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        estado: "OK",
        sistema: "MAREXPRESS API"
    });
});

export default router;
