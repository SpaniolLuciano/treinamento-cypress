import express, { NextFunction, Request, Response } from "express"
import jsonwebtoken, { JwtPayload } from "jsonwebtoken"
import { prisma } from "./prisma"

const app = express()
app.use(express.json())

function isAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1] || ""
    if (!token) {
        res.status(403).send("Token vazio")
        return
    }
    try {
        const { user, rule} = jsonwebtoken.verify(token, "henrique") as JwtPayload
        req.headers["user_id"] = user;
        req.headers["rule"] = rule;
        next()
    } 
    catch {
        res.status(403).send("token invalido")
        return
    }
}


app.post("/schools", async (req: Request, res: Response) => {
    const { body } = req; 
    const school = await prisma.schools.create({
        data: {
            name: body.name,
            email: body.email,
            password: body.password 
        }
    })
    res.status(201).json(school)
    return
})
app.get("/schools", async (req: Request, res: Response) => {
    const schools = await prisma.schools.findMany()
    res.status(200).json(schools)
    return
})
app.post("/schools/login", async (req: Request, res: Response) => {
    const { body } = req
    const school = await prisma.schools.findFirst({
        where: {
            email: body.email
        }
    })
    if (school) {
        if (school.password === body.password) {
            const token = jsonwebtoken.sign({ user: school.id, rule: "school" }, "henrique", { expiresIn: '3m', algorithm: "HS256"})
            res.status(200).send(token)
        }
        
        else {
            res.status(401).send("Senha errada")
        }
    }
    else {
        res.status(404).send("Email nao existe")
    }
    return
})

app.post("/students", async (req: Request, res: Response) => {
    const { body } = req; 
    const student = await prisma.students.create({
        data: {
            name: body.name,
            email: body.email,
            password: body.password 
        }
    })
    res.status(201).json(student)
    return
})
app.get("/students", async (req: Request, res: Response) => {
    const students = await prisma.students.findMany()
    res.status(200).json(students)
    return
})
app.post("/students/login", async (req: Request, res: Response) => {
    const { body } = req
    const student = await prisma.students.findFirst({
        where: {
            email: body.email
        }
    })
    if (student) {
        if (student.password === body.password) {
            const token = jsonwebtoken.sign({ user: student.id, rule: "student" }, "henrique", { expiresIn: '3m', algorithm: "HS256"})
            res.status(200).send(token)
        }
        else {
            res.status(401).send("Senha errada")
        }
    }
    else {
        res.status(404).send("Email nao existe")
    }
    return
})

app.post("/teachers", isAuth, async (req: Request, res: Response) => {
    const { body } = req; 
    if (req.headers["rule"] === "school") {
        const teacher = await prisma.teachers.create({
            data: {
                name: body.name
            }
        })
        res.status(201).json(teacher)
        return
    }
    else {
        res.status(403).send("somente escola cria")
        return
    }
   
})
app.get("/teachers", async (req: Request, res: Response) => {
    const teachers = await prisma.teachers.findMany()
    res.status(200).json(teachers)
    return
})

app.post("/disciplines", isAuth, async (req: Request, res: Response) => {
    const { body } = req; 
    if (req.headers["rule"] === "school") {
        const discipline = await prisma.disciplines.create({
            data: {
                name: body.name,
                hours: body.hours
            }
        })
        res.status(201).json(discipline)
        return
    }
    else {
        res.status(403).send("somente escola cria")
        return
    }
})
app.get("/disciplines", async (req: Request, res: Response) => {
    const disciplines = await prisma.disciplines.findMany()
    res.status(200).json(disciplines)
    return
})

app.post("/classes", isAuth, async (req: Request, res: Response) => {
    const { body } = req;
    if (req.headers["rule"] === "school") {
        const classes = await prisma.classes.create({
            data: {
                day: body.day,
                time: body.time,
                disciplineId: body.disciplineId,
                teacherId: body.teacherId,
                schoolId: Number(req.headers["user_id"])
            },
            include: {
                discipline: true,
                school: true,
                teacher: true
            }
        })
        res.status(201).json(classes)
        return
    }
    else {
        res.status(403).send("somente escola cria")
        return
    }
})
app.get("/classes", async (req: Request, res: Response) => {
    const classes = await prisma.classes.findMany({
        include: {
            teacher: {
                select: {
                    name: true
                }
            },
            school: {
                select: {
                    name: true,
                    email: true
                }
            },
            discipline: {
                select: {
                    name: true,
                    hours: true
                }
            },
            student: {
                select: {
                    student: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            }
        }
    })
    res.status(200).json(classes)
    return
})
app.post("/classes/addStudent", isAuth, async (req: Request, res: Response) => {
    const { body } = req
    if (req.headers["rule"] === "student") {
        const add = await prisma.students_classes.create({
            data: {
                studentId: Number(req.headers["user_id"]), 
                classId: body.classId
            }
        })
        res.status(201).json(add)
        return
    }
    else {
        res.status(403).send("somente estudante cria")
        return 
    }

})

app.listen(8080);