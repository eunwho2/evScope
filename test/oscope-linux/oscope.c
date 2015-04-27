#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <stdint.h>
#include <assert.h>
#include <string.h>

/**
 * assume it is running on a little endian system so byte order is swapped
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
 * assume it is running on a little endian system so byte order is swapped
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
    int          sock;
    struct sockaddr_in addr;
    int         status;
    int         index;
    uint8_t     dgram[65536];
    uint16_t    channel;
    uint16_t    count;
    const char *ipaddr;
    uint16_t    port;

    // should make channel, count, ipaddr and port
    // program arguments
    channel = 1;
    count   = 600;
    ipaddr  = "127.0.0.1";
    port    = 55003;

    sock = socket(AF_INET,SOCK_DGRAM,0);
    assert(sock >= 0);

    // set receiver ip address and endpoint.
    //
    memset(&addr,0,sizeof(addr));
    addr.sin_addr.s_addr = inet_addr(ipaddr);
    addr.sin_port        = htons(port);
    addr.sin_family      = AF_INET;

    for(;;) {
        sleep(1);

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
