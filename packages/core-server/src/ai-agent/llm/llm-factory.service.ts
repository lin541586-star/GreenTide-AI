import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ILlmProvider, LlmProviderConfig } from './llm.interface';
import { GeminiProvider } from './gemini.provider';
import { DeepSeekProvider } from './deepseek.provider';

export interface AiDbConfig {
  provider: string;
  geminiApiKey: string;
  geminiModel: string;
  deepseekApiKey: string;
  deepseekModel: string;
  deepseekBaseUrl: string;
}

@Injectable()
export class LlmFactoryService {
  private readonly logger = new Logger(LlmFactoryService.name);
  private provider: ILlmProvider | null = null;

  constructor(private config: ConfigService) {
    this.initProvider();
  }

  private initProvider() {
    const activeProvider = this.config.get<string>('LLM_PROVIDER', 'gemini');
    const config = this.getProviderConfig(activeProvider);
    if (!config) return;

    switch (config.provider) {
      case 'gemini':
        if (config.apiKey) {
          this.provider = new GeminiProvider(config.apiKey, config.model);
          this.logger.log(`LLM 供應商: Gemini (模型: ${config.model})`);
        }
        break;
      case 'deepseek':
        if (config.apiKey) {
          this.provider = new DeepSeekProvider(config.apiKey, config.baseURL, config.model);
          this.logger.log(`LLM 供應商: DeepSeek (模型: ${config.model})`);
        }
        break;
    }

    if (!this.provider) {
      this.logger.warn('未設定 LLM API Key，AI 功能將使用規則回退模式');
    }
  }

  private getProviderConfig(provider: string): LlmProviderConfig | null {
    switch (provider) {
      case 'gemini':
        return {
          provider: 'gemini',
          apiKey: this.config.get('GEMINI_API_KEY', ''),
          model: this.config.get('GEMINI_MODEL', 'gemini-2.0-flash'),
        };
      case 'deepseek':
        return {
          provider: 'deepseek',
          apiKey: this.config.get('DEEPSEEK_API_KEY', ''),
          model: this.config.get('DEEPSEEK_MODEL', 'deepseek-chat'),
          baseURL: this.config.get('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1'),
        };
      default:
        return null;
    }
  }

  /** 從資料庫設定初始化 LLM Provider */
  initFromDbConfig(dbConfig: AiDbConfig): boolean {
    const { provider, geminiApiKey, geminiModel, deepseekApiKey, deepseekModel, deepseekBaseUrl } = dbConfig;
    const activeProvider = provider || 'gemini';

    if (activeProvider === 'gemini' && geminiApiKey) {
      this.provider = new GeminiProvider(geminiApiKey, geminiModel || 'gemini-2.0-flash');
      this.logger.log(`LLM 已從 DB 設定初始化: Gemini (模型: ${geminiModel})`);
      return true;
    }

    if (activeProvider === 'deepseek' && deepseekApiKey) {
      this.provider = new DeepSeekProvider(deepseekApiKey, deepseekBaseUrl || 'https://api.deepseek.com/v1', deepseekModel || 'deepseek-chat');
      this.logger.log(`LLM 已從 DB 設定初始化: DeepSeek (模型: ${deepseekModel})`);
      return true;
    }

    // 若 DB 無設定，降級回 .env 方式
    this.initProvider();
    return !!this.provider;
  }

  /** 切換 LLM 供應商（執行時期切換） */
  switchProvider(provider: string): boolean {
    const config = this.getProviderConfig(provider);
    if (!config || !config.apiKey) {
      this.logger.warn(`無法切換至 ${provider}：API Key 未設定`);
      return false;
    }

    switch (config.provider) {
      case 'gemini':
        this.provider = new GeminiProvider(config.apiKey, config.model);
        break;
      case 'deepseek':
        this.provider = new DeepSeekProvider(config.apiKey, config.baseURL, config.model);
        break;
    }
    this.logger.log(`LLM 供應商已切換至 ${provider}`);
    return true;
  }

  getProvider(): ILlmProvider | null {
    return this.provider;
  }

  getProviderName(): string {
    return this.provider?.name || 'none';
  }
}
