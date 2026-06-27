import { IsString, IsOptional } from 'class-validator';

export class LineWebhookQuery {
  @IsString()
  tenantId: string;
}

export class CreateLineChannelDto {
  @IsString()
  tenantId: string;

  @IsString()
  channelSecret: string;

  @IsString()
  channelAccessToken: string;
}
