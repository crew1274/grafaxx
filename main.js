"use strict";
var _ = require('lodash')
const { db, query } = require("@arangodb")
const { context } = require("@arangodb/locals")
const createRouter = require("@arangodb/foxx/router")
const router = createRouter()
const request = require("@arangodb/request");

context.use(router)

router.get("/", (req, res) =>
{
    res.json({
        ok: true,
    })
})

router.get("/test", (req, res) =>
{
    res.json({
        ok: true,
        req: req,
        res: res,
    })
})

router.post("/query", (req, res) =>
{
    let cfg = context.configuration
    let body = JSON.parse(req.body)
    let maps = db._collection(cfg.maps)
    let target_eqt = body.EQUIPMENTNO
    let datapoints = query`
    FOR doc IN ${maps}
    FILTER doc['target'] == ${target_eqt}
    RETURN doc
    `
    if (datapoints["_documents"][0]['redirdectUrl'])
    {
            let redirdectUrl = datapoints["_documents"][0]['redirdectUrl']
            let response = request.post(redirdectUrl + "/query", {
                body: JSON.stringify(body)
            })
            res.json(response.json)
    }
    else
    {
        res.throw("500", "非法的EQUIPMENTNO")
    }
})

router.get("/query", (req, res) =>
{
    let cfg = context.configuration
    let maps = db._collection(cfg.maps)
    let target_eqt = "VCP-002"
    let body = JSON.parse(req.body)
    let datapoints = query `
    FOR doc IN ${maps}
    FILTER doc['target'] == ${target_eqt}
    RETURN doc
    `
            let redirdectUrl = datapoints["_documents"][0]['redirdectUrl']
            let response = request.post(redirdectUrl + "/query", {
                body: JSON.stringify(body)
            })
            res.json(response.json)
})