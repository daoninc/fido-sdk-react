#!/bin/sh

# build.sh
#
# Created by Jonny Mortensen on FEB 2020.
# Copyright 2020 Daon. All rights reserved.
#
#

PROJECT_NAME=FIDOProject

OUTPUT_DIR=output
ARCHIVE=${OUTPUT_DIR}/${PROJECT_NAME}.xcarchive

# update cocao pods
pod install

if [ $? != 0 ]
then
exit 1
fi

# clean
rm -dfr ${OUTPUT_DIR}

if [ ! -d "${OUTPUT_DIR}" ]
then
mkdir ${OUTPUT_DIR}
fi

echo Exporting archive

xcodebuild clean archive -workspace FIDOProject.xcworkspace -scheme FIDOProject -configuration Release -archivePath "${ARCHIVE}" -allowProvisioningUpdates

#Check if build succeeded
if [ $? != 0 ]
then
exit 1
fi

xcodebuild -exportArchive -exportOptionsPlist exportoptions.plist -archivePath "${ARCHIVE}" -exportPath "${OUTPUT_DIR}" -allowProvisioningUpdates

mv ${OUTPUT_DIR}/*.ipa ../output
