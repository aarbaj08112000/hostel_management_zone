FROM node:20-alpine
WORKDIR /cars
# Install git
RUN apk add --no-cache git
# Use build arguments for security
ARG GIT_USERNAME
ARG GIT_PASSWORD
# Clone the private repo (adjust if your Git server uses a custom port or self-signed certs)
RUN git clone --branch docker-deploy http://${GIT_USERNAME}:${GIT_PASSWORD}@192.168.30.240/nodejs/kd-portal-backend-cars.git .
RUN npm install
# Create directory (Docker needs RUN)
RUN mkdir -p apps/cars
# Set the working directory for the cars app
WORKDIR /cars/apps/cars
COPY . /cars/apps/cars
RUN cd /cars/apps/cars
# Install dependencies
RUN npm install
# Build the app
RUN npm run build
# Expose the port your app runs on
EXPOSE 3001 6001
# Start the app
CMD ["npm", "run", "start"]
