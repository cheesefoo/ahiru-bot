import { Client } from 'pg';
import { Logger } from '../services';
let Logs = require('../../lang/logs.json');

export class DatabaseUtils {

    static async CheckIfExists(table: "SPACES" | "INSTAGRAM", shortcode: string, url?) {
        let client = await this.Connect();

        try {
            let res = await client.query(`SELECT * from ${table} WHERE shortcode='${shortcode}'`);
            if (res.rows.length == 0) {
                return false;
            } else {
                return true;
            }
        }
        catch (error) {
            Logger.error(Logs.error.database.replace('{DB}', table), error);
        }
        finally {
            client.end();
        }
    }
    static async Insert(table: "SPACES" | "INSTAGRAM", shortcode: string, url? : string) {
        let client = await this.Connect();
        try {
            let res = await client.query(`INSERT INTO ${table} (shortcode, url) VALUES('${shortcode}', '${url}')`);
        }
        catch (error) {
            Logger.error(Logs.error.database.replace('{DB}', table), error);
        }
        finally {
            client.end();
        }
    }

    /*
        static async Insert(table: "SPACES" | "INSTAGRAM", shortcode: string, metadata?:string, baseUrl?:string) {
        let client = await this.Connect();
        try {
            let res = await client.query(`INSERT INTO ${table} (shortcode, metadata, url) VALUES('${shortcode}', '${metadata}', '${baseUrl}')`);
        }
        catch (error) {
            Logger.error(Logs.error.database.replace('{DB}', table), error);
        }
        finally {
            client.end();
        }
    }
    */


    private static async Connect(): Promise<Client> {
        let cs = `postgres://xftvylgzxtlzjg:1c8577672fa547ea6b6f77302481c37da9688e5fadc653e91fde6d7b7fbd4b59@ec2-54-209-187-69.compute-1.amazonaws.com:5432/d9g4k6kdbc0vv9`

        const client = new Client({
            connectionString: cs,
            // connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            client.connect();
        } catch (error) {
            Logger.error(Logs.error.database.replace('{DB}', "database"), error);
        }
        return client;
    }
}

