import { createRequire } from 'node:module';
import pg from 'pg';
const  Client  = pg.Client;
import { Logger } from '../services';
const require = createRequire(import.meta.url);
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

    public static async GetRelaySetting() :Promise<boolean>{
        let client = await this.Connect();
        try {
            let res = await client.query(`SELECT RELAY from settings`);
            let setting = res.rows[0]?.relay;
            return "true" === setting;
        }
        catch (error) {
            Logger.error(Logs.error.database.replace('{DB}', 'settings'), error);
        }
        finally {
            client.end();
        }
    }
    public static async SetRelaySetting(setting:boolean) :Promise<void>{
        let client = await this.Connect();
        try {
            let s = setting?"true":"false";
            let res = await client.query(`UPDATE settings set RELAY = '${s}'`);

        }
        catch (error) {
            Logger.error(Logs.error.database.replace('{DB}', 'settings'), error);
        }
        finally {
            client.end();
        }
    }


    private static async Connect(){
        let cs = process.env.DATABASE_URL

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
