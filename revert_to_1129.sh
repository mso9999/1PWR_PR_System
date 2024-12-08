#!/bin/bash

# Convert all 1129 RTF files to txt
for rtf_file in 1129_*.rtf; do
    textutil -convert txt "$rtf_file"
done

# Move contents to active files
for txt_file in 1129_*.txt; do
    active_file=${txt_file#1129_}
    active_file=${active_file%_*}.${active_file##*_}
    active_file=${active_file%.txt}
    echo "Copying $txt_file to $active_file"
    cp "$txt_file" "$active_file"
done

# Clean up txt files
rm 1129_*.txt

# Stage changes
git add .

# Commit changes
git commit -m "Reverted all active files to 1129 versions"
