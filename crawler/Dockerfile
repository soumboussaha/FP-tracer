# syntax=docker/dockerfile:1

# Use playwright image provided by microsoft. includes node.
FROM mcr.microsoft.com/playwright:v1.21.1-focal

WORKDIR /app


## Install Foxhound ##

# Install unzip
RUN apt-get update
RUN apt-get install unzip

# copy foxhound binary
COPY bin/project-foxhound bin/project-foxhound

# unpack foxhound binary
RUN unzip ./bin/project-foxhound/project-foxhound.zip

# set environment variable to foxhound binary
ENV CONSENTSCAN_e=firefox/firefox


## Install Dependencies ##

# copy patches
COPY ./patches ./patches

# install dependencies
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install


## Install Crawler ##

# copy files
COPY . .

# entrypoint includes output path, which user can bind to
ENTRYPOINT ["./runWithAutoRestart.sh"]
