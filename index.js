// index.js -> abrir terminal
// > npm init
// > npm install express cors serverless-mysql

// Extensão a atualização automatica
// npm install nodemon
//  Inserir a seguinte linha no arquivo package.json, em "scripts"
// "start": "nodemon index.js"
// Depois, para rodar o projeto use sempre:
// > npm start

let express = require("express")
let cors = require("cors")
let mysql = require("serverless-mysql")

let porta= 3000
let app = express()
app.use(cors())
app.use(express.json())

let bd = mysql({
    config: {
        host: "127.0.0.1",
        database: "iftm_filmes",
        user: "root",
        password: ""
    }
})
app.get("/", async (req, res)=> {
    res.send("Rota inicial")
})
app.get("/filmes/:pagina", async(req, res)=>{
    try {
        let pagina = parseInt(req.params.pagina, 10);
        let offset = (pagina - 1) * 10;
        let paginas = await bd.query(`SELECT * FROM filmes ORDER BY nota DESC LIMIT ? OFFSET ?`,[filmesPorPagina, offset])
        res.send(paginas)
    } catch (error) {
        
    }
})

app.get("/filme/:id", async (req,res) => {
    let id = req.params.id
    let filmes = await bd.query(`SELECT * FROM filmes WHERE id= ?`,[id])
    res.send(filmes)
})

app.get("/filmes/busca/:palavra", async (req, res)=>{
    let palavra = req.params.palavra
    let pesquisa = await bd.query(`SELECT * FROM filmes WHERE filmes.titulo LIKE ?`, [`%${palavra}%`])
    res.send(pesquisa)
})

app.get("/generos/:genero", async (req, res)=>{
    let genero = req.params.genero
    let generos = await bd.query(`SELECT filmes.titulo 
        FROM ((filmes_generos INNER JOIN filmes ON filmes.id = filmes_generos.filme_id)
             INNER JOIN generos ON generos.id = filmes_generos.genero_id)
        WHERE generos.titulo= ?`, [genero])
    res.send(generos)
})

app.get("/ator/:id", async (req, res)=> {
    let id = req.params.id
    let atores = await bd.query(`SELECT atores.titulo, filmes.titulo 
        FROM ((atores_filmes INNER JOIN atores ON atores.id = atores_filmes.ator_id) 
        INNER JOIN filmes ON filmes.id = atores_filmes.filme_id) 
        WHERE atores.id= ?`, [id])
    res.send(atores)
})

app.get("/atores/busca/:palavra", async (req, res) => {
    try {
        let palavra = req.params.palavra;

        const resultados = await bd.query(
            `SELECT atores.titulo AS ator, filmes.titulo AS filme
             FROM atores_filmes
             INNER JOIN atores ON atores.id = atores_filmes.ator_id
             INNER JOIN filmes ON filmes.id = atores_filmes.filme_id
             WHERE atores.titulo LIKE ?`,
            [`%${palavra}%`]
        );

        let info = {};
        for (const item of resultados) {
            const ator = item.ator;
            const filme = item.filme;

            if (!info[ator]) {
                info[ator] = [];
            }
            info[ator].push(filme);
        }

        const resposta = Object.keys(info).map((ator) => ({
            ator,
            filmes: info[ator],
        }));

        res.json(resposta);
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ mensagem: `Erro interno no servidor: ${error.message}` });
    }
});


app.post("/atores", async (req, res)=>{
    try {
        let titulo = req.body.titulo
        let ator = await bd.query(`INSERT INTO atores (titulo) VALUES ( ? )`, [titulo])
        let atorID = ator.insertId;
        console.log(`ID do ator adicionado: ${atorID}`)
        res.send(ator)
    } catch (error) {
        console.log("Erro")
    }
})

app.put("/atores", async(req, res)=>{
    try{
    let id = req.body.id    
    let titulo = req.body.titulo
    let novo_nome = await bd.query(`UPDATE atores SET titulo = ? WHERE ID = ? `, [titulo, id])
    console.log("ID do autor modificado: " + id)
    res.send(novo_nome)
    } catch(error){
        console.log("Erro")
    }
})

app.delete("/atores/:id", async(req, res)=>{
     try {
        let ator_id = req.params.id
        let filmes_ator = await bd.query(`DELETE FROM atores_filmes WHERE ator_id = ?`, [ator_id])
        let atorRemovido = await bd.query(`DELETE FROM atores WHERE id = ?`, [ator_id])
        console.log("O registro removido foi o com o ID:" + ator_id)
        let Removidos= {
            "Participacoes": filmes_ator,
            "Ator": atorRemovido 
        }
        console.log(`ID do Ator removido: ${ator_id}`)
        res.send(Removidos)
     } catch (error) {
        console.log("ERRO")
     }
})

app.post("/participacoes/:idAtor/:idFilme", async (req, res)=>{
    try {
        let ator_id = req.body.ator_id
        let filme_id = req.body.filme_id
        let participacao = await bd.query(` INSERT INTO atores_filmes (ator_id, filme_id) VALUES ( ? , ? )`, [ator_id, filme_id])
        
        console.log(`ID da tablea utilizada:${participacao.insertId}`)
        res.send(participacao)
    } catch (error) {
        console.log("Erro")
    }
    
})

app.delete("/participacoes/:idAtor/:idFilme", async(req, res)=>{
    try {
        let ator_id = req.params.ator_id
        let filme_id = req.params.filme_id
        let participacao = await bd.query(`DELETE FROM atores_filmes WHERE ator_id = ? AND filme_id= ?`, [ator_id, filme_id])
        console.log(`O registro removido foi o do ID:${ator_id}`)
        res.send(participacao)
    } catch (error) {
        console.log("ERRO")
    }
})

app.listen(porta, () => {
    console.log(`Servidor rodando em http://127.0.0.1:${porta}`)
})