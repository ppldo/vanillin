VANILLIN_PATH=`realpath ./dist/bin/vanillin.js`
cd ~/work
find ./build -name '*.css' -print0 | while read -d $'\0' file_name
do
    echo $file_name
    new_filename=./src/vanillin/"$file_name.ts"
    mkdir -p `dirname "$new_filename"`
    cat "$file_name" | node $VANILLIN_PATH > $new_filename
done
