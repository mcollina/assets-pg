UPDATE assets SET name=$2, status=$3 WHERE id=$1 RETURNING id, name, status
