import { LogHelper } from "./../helpers/LogHelper"
import { AuthHandlerConfig } from "../auth/authHandlers/AbstractHandler"
import { PrimaryProviderConfig } from "../auth/primaryProviders/AbstractProvider"
import { SecondProviderConfig } from "../auth/secondaryProviders/AbstractProvider"
import { TextureProviderConfig } from "../auth/textureProviders/AbstractTextureProvider"
import { StorageHelper } from "../helpers/StorageHelper"
import { App } from "../LauncherServer"
import { AuthConfig, Envirovement, LauncherServerConfig, WebSocketConfig } from "./LauncherServerConfig"
import fs = require("fs")

export class ConfigManager {
    private config: LauncherServerConfig

    constructor() {
        if (fs.existsSync(StorageHelper.configFile)) {
            LogHelper.info("Loading configuration")
            this.load()
        } else {
            LogHelper.info("Configuration not found! Create default config")
            this.config = this.getDefaults()
            this.save()
        }
    }

    getProperty(property: string, raw: boolean = false): any {
        const path = property.split(".")
        let prop: any = this.config
        path.forEach((el) => {
            prop = prop[el]
            if (prop === undefined) {
                if (!raw) LogHelper.fatal(App.LangManager.getTranslate("ConfigManager.propNotFound"), property)
                return prop
            }
        })
        return prop
    }

    getDefaults(): LauncherServerConfig {
        const config = new LauncherServerConfig()
        config.configVersion = "1"
        config.lang = "en"
        config.env = Envirovement.DEV
        config.updatesUrl = ["https://mirror.aurora-launcher.ru/"]
        config.auth = new AuthConfig()
        config.auth.primaryProvider = new PrimaryProviderConfig()
        config.auth.primaryProvider.type = "none"
        config.auth.secondProvider = new SecondProviderConfig()
        config.auth.secondProvider.type = "none"
        config.auth.authHandler = new AuthHandlerConfig()
        config.auth.authHandler.type = "none"
        config.auth.textureProvider = new TextureProviderConfig()
        config.auth.textureProvider.type = "none"
        config.hwid = new AuthHandlerConfig()
        config.hwid.type = "none"
        config.ws = new WebSocketConfig()
        config.ws.address = "ws://localhost:1370/"
        config.ws.ip = "0.0.0.0"
        config.ws.port = 1370
        return config
    }

    load(): void {
        const config = fs.readFileSync(StorageHelper.configFile)
        try {
            this.config = JSON.parse(config.toString())
        } catch (e) {
            if (e instanceof SyntaxError) {
                LogHelper.error(e)
                LogHelper.fatal("Json syntax broken. Try fix or delete LauncherServerConfig.json")
            }
        }
    }

    save(): void {
        fs.writeFileSync(StorageHelper.configFile, JSON.stringify(this.config, null, 4))
    }
}
