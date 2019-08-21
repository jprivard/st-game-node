let user = {find: ()=> {}};
let character = {find: () => {}};
let io = {emit: () => {}};
let res = {redirect: ()=>{}, send: () => {}, sendStatus: () => {}, header: () => {}};
let app = {route: ()=>{}, get: ()=>{}, post: ()=>{}, use: () => {}};
let passport = {authenticate: () => {}};

module.exports = { user, character, io, res, app, passport };