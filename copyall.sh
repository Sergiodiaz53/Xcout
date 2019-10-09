#!/usr/bin/env bash

# url to pistacho: http://pistacho.ac.uma.es:8069/API/updateDB/
url=$1
input="file_paths.txt"

echo "COPYALL.sh <url>"

while IFS= read -r var
do
	# Remove all existing files in images
	echo "--> Deleting images/ content"
	rm images/*

	# Copy all from papaya

	# To connect to papaya use sshpass to pass the password when using ssh
	# Install: sudo apt install sshpass
	# Use: sshpass -p "password" scp -r user@example.com:/some/remote/path /some/local/path
	# or generate a RSA key following this tutorial
	# http://www.linuxproblem.org/art_9.html

	copy=${var}/*.filt.png

	echo "--> Copying from papaya to images/: $copy"
	scp marcossr@papaya.ac.uma.es:$copy images/
        copy=${var}/*events.txt
	scp marcossr@papaya.ac.uma.es:$copy images/
	copy=${var}/index*
	scp marcossr@papaya.ac.uma.es:$copy images/

	echo "--> Copying from papaya to media/: $copy"
	scp marcossr@papaya.ac.uma.es:$copy media/
        copy=${var}/*events.txt
        scp marcossr@papaya.ac.uma.es:$copy media/
        copy=${var}/index*
        scp marcossr@papaya.ac.uma.es:$copy media/

	# Rename index
	echo "--> Renaming index"
	name=$(ls images/index*)
	mv $name images/test.csv

	# Start the server
	echo "--> Starting server $1"
	python manage.py runserver_plus &

	# Wait a few for it to finish loading
	echo "--> Waiting 10 seconds to load up"
	sleep 10s

	# Trigger addition
	echo "--> Updating DB"
	wget ${1}/xcout/API/updateDB/

	# Kill it
	echo "--> Killing job"
	kill $(jobs -p)

done < "$input"

echo "--> Done!"
