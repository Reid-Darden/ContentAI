@echo off
SETLOCAL

REM Define the base directory
SET "BaseDir=D:\Coding\Development\ContentAI\files"

REM Delete files in parsedPDFs\uploads
IF EXIST "%BaseDir%\parsedPDFs\uploads\*" (
    DEL /Q "%BaseDir%\parsedPDFs\uploads\*"
    ECHO Deleted files in %BaseDir%\parsedPDFs\uploads
)

REM Delete files in uploads
IF EXIST "%BaseDir%\uploads\*" (
    DEL /Q "%BaseDir%\uploads\*"
    ECHO Deleted files in %BaseDir%\uploads
)

REM Delete all contents in the unzipped folder (files and subfolders)
IF EXIST "%BaseDir%\unzipped\*" (
    RMDIR /S /Q "%BaseDir%\unzipped"
    MKDIR "%BaseDir%\unzipped"
    ECHO Emptied the unzipped folder
)

ECHO Deletion complete.