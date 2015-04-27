#define WIN32_LEAN_AND_MEAN
#include <WinSock2.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <stdint.h>
#include <assert.h>
#include <string.h>

/**
 * convert an uint16_t to network byte order and poke it into a buffer
 */
int32_t utl_htonus(unsigned char* b, uint16_t u)
{
    unsigned char* s = (unsigned char*)&u;
    b[1] = s[0];
    b[0] = s[1];

    return 2;
}

/**
 * convert an int16_t to network byte order and poke it into a buffer
 */
int32_t utl_htons(unsigned char* b, int16_t u)
{
    unsigned char* s = (unsigned char*)&u;
    b[1] = s[0];
    b[0] = s[1];

    return 2;
}

int main(int argc,char *argv[])
{
    WSADATA     wsa;
    SOCKET      sock;
    struct sockaddr_in addr;
    int         status;
    int         index;
    uint8_t     dgram[65536];
    uint16_t    channel;
    uint16_t    count;
    const char *ipaddr
    uint16_t    port;

    // should make channel, count, ipaddr and port
    // program arguments
    channel = 1;
    count   = 600;
    ipaddr  = "192.168.51.233";
    port    = "55003";

    WSAStartup(0x0202,&wsa);

    sock = socket(AF_INET,SOCK_DGRAM,0);
    assert(sock != INVALID_SOCKET);

    // set receiver ip address and endpoint. 
    // 
    memset(&addr,0,sizeof(addr));
    addr.sin_addr.S_un.S_addr = inet_addr(ipaddr);
    addr.sin_port             = htons(port);
    addr.sin_family           = AF_INET;

    for(;;) {
        Sleep(100);

        // format an outgoing message
        index = 0;
        // channel
        index += utl_htonus(&dgram[index],channel);
        // length
        index += utl_htonus(&dgram[index],count);
        // samples
        int16_t v;
        double  r = (double)rand();
        for(int i=0;i<count;++i) {
            // simulate some data
            v = (int16_t)(sin(r/3.141592) * 32767);
            index += utl_htons(&dgram[index],v);
            r += 1.0;
        }
        status = sendto(sock,(const char *)dgram,index,0,(struct sockaddr *)&addr,sizeof(addr));
    }

    return 0;
}