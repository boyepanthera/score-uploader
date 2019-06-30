$('#student-list').on('click', '.delete-item' ,(e) => {
    e.preventDefault();
    let confirmStatus = confirm('do you really want to delete?');
    if (confirmStatus) {
        let url = (this).attr('action');
        $itemtoRemove = (this).closest('.student');
        $.ajax ({
            url,
            type:'DELETE',
            itemtoRemove:$itemtoRemove,
            success: (data) => {
                this.itemtoRemove.remove();
            }
        })
    }
} )