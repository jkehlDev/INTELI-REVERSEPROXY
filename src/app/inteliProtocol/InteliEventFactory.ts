import WebServerEvent from 'app/inteliProtocol/webServerEvent/WebServerEvent';
import ActionEnum from 'app/inteliProtocol/enums/EventActions';
import TypeEnum from 'app/inteliProtocol/enums/EventTypes';
import InteliAgentSHA256 from './Authentification/InteliAgentSHA256';
import SysAdminEvent from './sysAdminEvent/SysAdminEvent';

class EventFactory {
  static makeWebServerEvent(
    action: ActionEnum.open | ActionEnum.close,
    inteliAgentSHA256: InteliAgentSHA256,
    version: string,
    host: string,
    port: number,
    rule: string = '/',
  ): Readonly<WebServerEvent> {
    return {
      header: { type: TypeEnum.webServer, action },
      authentification: inteliAgentSHA256,
      payload: {
        hostId: inteliAgentSHA256.agentId,
        version,
        rule,
        target: {
          host,
          port,
        },
      },
    };
  }
  static makeSysAdminEvent(
    action: ActionEnum.add | ActionEnum.remove,
    inteliAgentSHA256: InteliAgentSHA256,
    hostId: string,
    publicKey?: string
  ): Readonly<SysAdminEvent> {
    return {
      header: { type: TypeEnum.sysadmin, action },
      authentification: inteliAgentSHA256,
      payload: { hostId, publicKey },
    };
  }
}

export default EventFactory;
