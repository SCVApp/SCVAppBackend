import postgres from "postgres"
import { env } from "process"

const sql = postgres({
    host: env.DB_HOST,
    port:env.DB_PORT,
    database:env.DB_NAME,
    username:env.DB_USERNAME,
    password:env.DB_PASSWORD,
    ssl:env.DB_SSL
})

export default sql