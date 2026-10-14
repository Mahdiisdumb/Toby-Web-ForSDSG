# Use official Nginx image
FROM nginx:alpine

# Copy HTML & CSS into Nginx's default directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80
