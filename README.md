# HarperDB FTP Server Custom Function

The is a [HarperDB](https://harperdb.io/) Custom Function to launch an FTP Server for easy file uploads.

## Setup

This [Custom Function](https://harperdb.io/docs/custom-functions/) can be deployed via the [HarperDB Studio](https://studio.harperdb.io/) or locally by cloning this repository into a directory inside the `/custom_functions/` directory (i.e `/custom_funtions/ftp-server`).

Configure the port, username and password with the following environment variables. These are the default values.

```
FTP_PORT=9921
FTP_USERNAME=anonymous
FTP_PASSWORD=@anonymous
```

## How to Use

1. Ensure the above environment variables have been set.
2. Create a GET request to [$HOST/ftp-server/start]($HOST/ftp-server/start) to start the server.
3. Visit [ftp://$HOST:$FTP_PORT](ftp://$HOST:$FTP_PORT) to access the server, using the above username and password
4. Uplodate a file with the name containing the desired schema and table destination (i.e. `DevSchema-DogsTable-upload123.csv`)
5. When finished, stop the server by creating a GET request to [$HOST/ftp-server/stop]($HOST/ftp-server/stop)
