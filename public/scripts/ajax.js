$('#new-comment-form').submit(function(e) {
	e.preventDefault();

	var comment = $(this).serialize();
	var actionUrl = $(this).attr('action');
	$.post(actionUrl, comment, function(data) {
		$('.complete-comment-div').append(
			`
			<div class="col-md-12 comment-div">
                <strong>${data.comment.author.username}</strong>
                <span class="pull-right">${moment(data.comment.createdAt).fromNow()}</span>
                <div class="comment-update">
                    <p>
                        ${data.comment.text}
                    </p>
                        <div class="text-right">
                            <!-- Agregamos form para editar -->
                            <form class="edit-comment-form" action="/campgrounds/${data.campground_id}/comments/${data.comment._id}" method="post">
                                <div class="form-group">
                                    <input class="form-control" type="text" name="comment[text]" value="${data.comment.text}>"></input>
                                </div>
                                <div class="form-group">
                                    <button class="btn btn-primary btn-large btn-block">Submit!</button>
                                </div>
                            </form>
                            <!-- FIN - Agregamos form para editar -->
                            <button class="btn btn-xs btn-warning" id="edit-button">
                            Edit
                            </button>
                            <form class="delete-comment-form" action="/campgrounds/${data.campground_id}/comments/${data.comment._id}" method="POST">
                                <button type="submit" class="btn btn-xs btn-danger" >Delete</button>
                            </form>
                        </div>
                </div>
            </div>
            <hr>
			`
			);
		$('#new-comment-form').find('.form-control').val('');
	});
});


// EDIT Comments
$('.complete-comment-div').on('click', '#edit-button', function (e) {
    e.preventDefault();
	$(this).siblings('.edit-comment-form').toggle();
});

$('.complete-comment-div').on('submit', '.edit-comment-form', function (e) {
	e.preventDefault();
	var comment = $(this).serialize();
	var actionUrl = $(this).attr('action');
	var $originalItem = $(this).parent().parent('.comment-update')

	$.ajax({
		url: actionUrl,
		data: comment,
		type: 'PUT',
		originalItem: $originalItem,
		success: function success(data) {
			this.originalItem.html(
                `
                <div class="comment-update">
                    <p>
                        ${data.comment.text}
                    </p>
                        <div class="text-right">

                            <!-- Agregamos form para editar -->
                            <form class="edit-comment-form" action="/campgrounds/${data.campground_id}/comments/${data.comment._id}" method="post">
                                <div class="form-group">
                                    <input class="form-control" type="text" name="comment[text]" value="${data.comment.text}"></input>
                                </div>
                                <div class="form-group">
                                    <button class="btn btn-primary btn-large btn-block">Submit!</button>
                                </div>
                            </form>
                            <!-- FIN - Agregamos form para editar -->

                            <button class="btn btn-xs btn-warning" id="edit-button">
                            Edit
                            </button>
                            <form class="delete-comment-form" action="/campgrounds/${data.campground_id}/comments/${data.comment._id}" method="POST">
                                <button type="submit" class="btn btn-xs btn-danger">Delete</button>
                            </form>
                        </div>
                </div>

                `
            );
		}
	});
});

//DELETE Comments
$('.complete-comment-div').on('submit', '.delete-comment-form', function(e) {
	e.preventDefault();
	var confirmResponse = confirm('Are you sure?');
	if(confirmResponse) {
		var actionUrl = $(this).attr('action');
		var $itemToDelete = $(this).closest('.comment-div');
		$.ajax({
			url: actionUrl,
			type: 'DELETE',
			itemToDelete: $itemToDelete,
			success: function(data) {
				this.itemToDelete.remove();
			}
		});
	} else {
		$(this).find('button').blur();
	}
});