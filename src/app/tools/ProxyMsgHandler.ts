// <== Imports externals modules
import { inteliSHA256CheckValidity } from 'app/inteliProtocol/Authentification/InteliAgentSHA256';
import ActionEnum from 'app/inteliProtocol/enums/EventActions';
import EventEncode from 'app/inteliProtocol/enums/EventEncode';
import TypeEnum from 'app/inteliProtocol/enums/EventTypes';
import InteliEvent from 'app/inteliProtocol/InteliEvent';
import SysAdminEvent from 'app/inteliProtocol/sysAdminEvent/SysAdminEvent';
import WebServerEvent from 'app/inteliProtocol/webServerEvent/WebServerEvent';
import fs from 'fs';
import { connection as Connection, IMessage } from 'websocket';
import ProxySelector from './ProxySelector';

import getLogger from 'app/tools/logger';
import ResolveStates from './ResolveStates';

// ==>
// LOGGER INSTANCE
const logger = getLogger('ProxyMsgHandler');

export default abstract class ProxyMsgHandler {
  /**
   * @method ProxyMsgHandler#wsCliMessageHandler WS connection message event handler
   * @param connection WS client connection object
   * @param proxySelector Instance of ProxySelector
   * @param data WS client connection IMessage object
   * @returns {Promise<ResolveState>} Resolution state or reject with error object
   */
  public msgHandler(
    connection: Connection,
    proxySelector: ProxySelector,
    data: IMessage
  ): Promise<ResolveStates> {
    return new Promise((resolve, reject) => {
      try {
        if ((data.type = EventEncode.utf8)) {
          const event: InteliEvent<TypeEnum, ActionEnum, any, any> = JSON.parse(
            data.utf8Data
          );
          if (inteliSHA256CheckValidity(event.authentification)) {
            switch (event.header.type) {
              case TypeEnum.sysadmin:
                return this.resolveSysAdminMsg(event as SysAdminEvent);
              case TypeEnum.webServer:
                return this.resolveWebServerMsg(
                  connection,
                  proxySelector,
                  event as WebServerEvent
                );
              default:
                return this.resolvePersonalizedMsg(
                  connection,
                  proxySelector,
                  event
                );
            }
          } else {
            resolve(ResolveStates.UNAUTHORIZED);
          }
        } else {
          resolve(ResolveStates.INVALID);
        }
      } catch (err) {
        reject(err);
      }
    });
  }
  private resolveSysAdminMsg(event: SysAdminEvent): Promise<ResolveStates> {
    return new Promise((resolve, reject) => {
      try {
        switch (event.header.action) {
          case ActionEnum.add:
            logger.info(
              `Sysadmin add public certificat to certstore event received for agentID:[${event.payload.hostId}].`
            );
            fs.writeFileSync(
              `${process.cwd()}/certstore/${
                event.payload.hostId
              }_publicKey.pem`,
              event.payload.publicKey
            );
            resolve(ResolveStates.VALID);
            break;
          case ActionEnum.remove:
            logger.info(
              `Sysadmin remove public certificat from certstore event received for agentID:[${event.payload.hostId}].`
            );
            fs.rmSync(
              `${process.cwd()}/certstore/${event.payload.hostId}_publicKey.pem`
            );
            resolve(ResolveStates.VALID);
            break;
          default:
            resolve(ResolveStates.INVALID);
            break;
        }
      } catch (err) {
        reject(err);
      }
    });
  }
  private resolveWebServerMsg(
    connection: Connection,
    proxySelector: ProxySelector,
    event: WebServerEvent
  ): Promise<ResolveStates> {
    return new Promise((resolve, reject) => {
      try {
        switch (event.header.action) {
          case ActionEnum.open:
            proxySelector
              .addHost(connection, event.payload)
              .then(() => {
                resolve(ResolveStates.VALID);
              })
              .catch((err) => {
                reject(err);
              });
            break;
          case ActionEnum.close:
            connection.close(Connection.CLOSE_REASON_NORMAL, `NORMAL CLOSE`);
            resolve(ResolveStates.VALID);
            break;
          default:
            resolve(ResolveStates.INVALID);
            break;
        }
      } catch (err) {
        reject(err);
      }
    });
  }
  abstract resolvePersonalizedMsg(
    connection: Connection,
    proxySelector: ProxySelector,
    event: InteliEvent<TypeEnum, ActionEnum, any, any>
  ): Promise<ResolveStates>;
}
export class DefaultProxyMsgHandler extends ProxyMsgHandler {
  resolvePersonalizedMsg(
    connection: Connection,
    proxySelector: ProxySelector,
    event: InteliEvent<TypeEnum, ActionEnum, any, any>
  ): Promise<ResolveStates> {
    return new Promise((resolve, rejects) => {
      resolve(ResolveStates.INVALID);
    });
  }
}
