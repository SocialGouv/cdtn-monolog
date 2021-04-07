data=03-2021.json
cache=cache-$data
suggestions=suggestions.txt

yarn monolog retrieve -o $data
yarn monolog cache -d $data -o $cache
yarn monolog monthly -d $data -c $cache
yarn monolog queries -d $data -c $cache -s $suggestions
