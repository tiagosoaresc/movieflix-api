import express from 'express'
import { PrismaClient } from '@prisma/client'

const port = 3000
const app = express()
const prisma = new PrismaClient()

app.use(express.json())

app.get('/movies', async (req, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: 'asc',
        },
        include: {
            genres: true,
            languages: true,
        },
    })
    res.json(movies)
})

app.post('/movies', async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } = req.body

    try {
        // 1. Verificar no banco se já existe um filme com o mesmo nome que está sendo enviado

        // 2. Case insensitive - se a busca for feita por letra minúscula ou maiúscula não irá importar, pois será o mesmo nome e o registro vai ser retornado na consulta.
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: {
                title: { equals: title, mode: 'insensitive' },
            },
        })

        if (movieWithSameTitle) {
            return res
                .status(409)
                .send({
                    message: 'Já existe um filme cadastrado com esse título',
                })
        }

        await prisma.movie.create({
            data: {
                title: title,
                genre_id: genre_id,
                language_id: language_id,
                oscar_count: oscar_count,
                release_date: new Date(release_date),
            },
        })
    } catch (error) {
        return res.status(500).send({ message: 'Falha ao cadastrar o filme' })
    }

    res.status(201).send()
})

app.put('/movies/:id', async (req, res) => {
    // Pegar o ID do registro que será atualizado
    const id = Number(req.params.id)

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id: id,
            },
        })

        if (!movie) {
            return res
                .status(404)
                .send({ message: 'Filme não encontrado, esse ID não existe.' })
        }

        const data = { ...req.body }
        // Transformando a data que está em tipo sting em um tipo date, para que possa ser adicionado no banco de dados. Caso n'ao possua uma release_date ela ter o valor undefined e o prisma não irá atualiza-la
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined

        // Pegar os dados do filme que será atualizado e atualizar ele no prisma
        await prisma.movie.update({
            where: {
                id: id,
            },
            // Transformar a string da requisição em um tipo date pra conseguir aloca-la no banco de dados
            data: data,
        })
    } catch (error) {
        return res
            .status(500)
            .send({ message: 'Falha ao atualizar o registro do filme.' })
    }

    // Retornar o status correto informando que o filme foi atualizado
    res.status(200).send({ message: `O filme com o id: ${id}, foi atualizado` })
})

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`)
})
