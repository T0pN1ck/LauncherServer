import * as fs from "fs"
import * as path from "path"
import { URL } from "url"

import rimraf from "rimraf"

import { HttpHelper } from "../helpers/HttpHelper"
import { JsonHelper } from "../helpers/JsonHelper"
import { LogHelper } from "../helpers/LogHelper"
import { StorageHelper } from "../helpers/StorageHelper"
import { ZipHelper } from "../helpers/ZipHelper"
import { App } from "../LauncherServer"
import { ProfileConfig } from "../profiles/types/ProfileConfig"

export class MirrorManager {
    /**
     * Скачивание клиена с зеркала
     * @param clientName - Название архива с файлами клиента
     * @param dirName - Название конечной папки
     */
    async downloadClient(clientName: string, dirName: string): Promise<void> {
        const mirrors: string[] = App.ConfigManager.getConfig().mirrors
        const clientDir = path.resolve(StorageHelper.updatesDir, dirName)
        if (fs.existsSync(clientDir)) return LogHelper.error(App.LangManager.getTranslate().MirrorManager.dirExist)

        const mirror = mirrors.find(async (mirror) => {
            if (
                (await HttpHelper.existFile(new URL(`/clients/${clientName}.json`, mirror))) &&
                (await HttpHelper.existFile(new URL(`/clients/${clientName}.zip`, mirror)))
            )
                return true
        })
        if (mirror === undefined) return LogHelper.error(App.LangManager.getTranslate().MirrorManager.client.notFound)

        let profile: string
        let client: string

        try {
            LogHelper.info(App.LangManager.getTranslate().MirrorManager.client.download)
            profile = await HttpHelper.readFile(new URL(`/clients/${clientName}.json`, mirror))
            client = await HttpHelper.downloadFile(new URL(`/clients/${clientName}.zip`, mirror), null, {
                saveToTempFile: true,
            })
        } catch (error) {
            LogHelper.error(App.LangManager.getTranslate().MirrorManager.client.downloadErr)
            LogHelper.debug(error)
            return
        }

        try {
            fs.mkdirSync(clientDir)
            LogHelper.info(App.LangManager.getTranslate().MirrorManager.client.unpacking)
            ZipHelper.unzipArchive(client, clientDir)
        } catch (error) {
            fs.rmdirSync(clientDir, { recursive: true })
            LogHelper.error(App.LangManager.getTranslate().MirrorManager.client.unpackingErr)
            LogHelper.debug(error)
            return
        } finally {
            rimraf(client, (e) => {
                if (e !== null) LogHelper.warn(e)
            })
        }

        //Profiles
        App.ProfilesManager.createProfile({
            ...JsonHelper.fromJSON(profile),
            clientDir: dirName,
            servers: [
                {
                    title: dirName,
                },
            ],
        } as ProfileConfig)
        LogHelper.info(App.LangManager.getTranslate().MirrorManager.client.success)
    }

    /**
     * Скачивание ассетов с зеркала
     * @param assetsName - Название архива с файлами ассетов
     * @param dirName - Название конечной папки
     */
    async downloadAssets(assetsName: string, dirName: string): Promise<void> {
        const mirrors: string[] = App.ConfigManager.getConfig().mirrors
        const assetsDir = path.resolve(StorageHelper.updatesDir, dirName)
        if (fs.existsSync(assetsDir)) return LogHelper.error(App.LangManager.getTranslate().MirrorManager.dirExist)

        const mirror = mirrors.find(async (mirror) => {
            if (await HttpHelper.existFile(new URL(`/assets/${assetsName}.zip`, mirror))) return true
        })
        if (mirror === undefined) return LogHelper.error(App.LangManager.getTranslate().MirrorManager.assets.notFound)

        let assets: string

        try {
            LogHelper.info(App.LangManager.getTranslate().MirrorManager.assets.download)
            assets = await HttpHelper.downloadFile(new URL(`/assets/${assetsName}.zip`, mirror), null, {
                saveToTempFile: true,
            })
        } catch (error) {
            LogHelper.error(App.LangManager.getTranslate().MirrorManager.assets.downloadErr)
            LogHelper.debug(error)
            return
        }

        try {
            fs.mkdirSync(assetsDir)
            LogHelper.info(App.LangManager.getTranslate().MirrorManager.assets.unpacking)
            ZipHelper.unzipArchive(assets, assetsDir)
        } catch (error) {
            fs.rmdirSync(assetsDir, { recursive: true })
            LogHelper.error(App.LangManager.getTranslate().MirrorManager.assets.unpackingErr)
            LogHelper.debug(error)
            return
        } finally {
            rimraf(assets, (e) => {
                if (e !== null) LogHelper.warn(e)
            })
        }

        LogHelper.info(App.LangManager.getTranslate().MirrorManager.assets.success)
    }
}
