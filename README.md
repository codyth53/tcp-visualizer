# TCP Visualizer

This tool will visualize different aspects of a TCP connection given two PCAPNG packet traces.
The tool assumes a primarily one-way communication with a "sender" and "receiver".

### Features:
* Visual back-and-forth traffic between the two hosts
* Instantaneous "in-flight" unacknowledged bytes as seen by the sending host
* SEQ and ACK values sent/received over time

### Packet Trace Requirements:
* PCAPNG files only contain packets for the same TCP connection
* The complete three-way handshake is present in both PCAPNG files
* No fragmentation occurred between the two hosts
* Both PCAPNG files use the same time resolution
  * If in doubt, use Wireshark to save as PCAP and back to PCAPNG
  
### Notes:
Graph performance degrades with large amounts of packets.