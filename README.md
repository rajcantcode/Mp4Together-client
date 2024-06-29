# Mp4Together - A web application which enables watching youtube, local videos together with friends and family, and communicate over text chat and live audio calling
Built with the React, MongoDB, Express, Node.js, mediasoup

## Features
- Room functionality
- Synchronised video playback
- Communicate via text chat and live audio calling

## Getting started
To run this project loacally, you will require all the three repositories ([server](https://github.com/rajcantcode/Mp4Together-server), [client](https://github.com/rajcantcode/Mp4Together-client), [sfu](https://github.com/rajcantcode/Mp4Together-sfu)).

Clone all the 3 repositories into a single folder.

There are two ways to run this project locally
- using docker (recommended way)
- traditional way of installing dependencies, configuring environment etc

1] Using docker (prerequisite: Docker must be installed on your machine)
- For each repository, there is a `.env.example` file
  - copy the contents of `.env.example` file
  - create a new `.env` file and paste the contents into it
- cd into Mp4Together-server
- In the terminal set the environment variable HOST_IP to the private ip of your local machine.
  - For mac
    - `export HOST_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)`
  - For linux
    - `export HOST_IP=$(ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d'/' -f1 | head -n 1)`
  - For windows
    - `$env:HOST_IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.0.0.1" -and $_.AddressState -eq "Preferred" } | Select-Object -First 1).IPAddress`
- Run `docker compose up`
